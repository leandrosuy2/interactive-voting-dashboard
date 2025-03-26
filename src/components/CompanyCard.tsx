
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, ThumbsUp, Award, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CompanyCardProps {
  id: string;
  name: string;
  description: string;
  totalVotes: number;
  serviceCount: number;
  isTopVoted?: boolean;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ 
  id, 
  name, 
  description, 
  totalVotes, 
  serviceCount,
  isTopVoted = false 
}) => {
  return (
    <Card className="glass-card overflow-hidden transition-all duration-300 hover:shadow-lg interactive h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">{name}</CardTitle>
          </div>
          {isTopVoted && (
            <Badge className="bg-primary/20 text-primary border-primary/30">
              <Award className="mr-1 h-3 w-3" />
              Top Votada
            </Badge>
          )}
        </div>
        <CardDescription className="text-sm text-muted-foreground truncate-text">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 text-sm">
            <ThumbsUp className="h-4 w-4 text-primary" />
            <span className="font-medium">{totalVotes}</span>
            <span className="text-xs text-muted-foreground">votos</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {serviceCount} serviços
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Link to={`/companies/${id}`} className="w-full">
          <Button variant="secondary" className="w-full group" size="sm">
            <span>Ver detalhes</span>
            <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default CompanyCard;
